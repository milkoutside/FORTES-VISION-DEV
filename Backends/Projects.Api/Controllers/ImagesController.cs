using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Projects.Api.Contracts.Common;
using Projects.Api.Contracts.Images;
using Projects.Api.Contracts.Projects;
using Shared.Database;
using Shared.Domain.Common;
using Shared.Domain.Users;
using ImageUserEntity = Shared.Domain.Images.ImageUser;
using TaskEntity = Shared.Domain.Tasks.Task;

namespace Projects.Api.Controllers;

[ApiController]
[Route("projects/{projectId:long}/batches/{batchId:long}/images")]
public class ImagesController : ControllerBase
{
    private readonly SharedDbContext _db;
    public ImagesController(SharedDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ImageDto>>>> Index(long projectId, long batchId, CancellationToken ct)
    {
        var batchExists = await _db.Batches.AnyAsync(b => b.Id == batchId && b.ProjectId == projectId, ct);
        if (!batchExists) return NotFound(ApiResponse.Failure<IEnumerable<ImageDto>>("Batch not found."));

        var images = await _db.Images.AsNoTracking()
            .Where(i => i.BatchId == batchId)
            .ToListAsync(ct);
        var imageIds = images.Select(i => i.Id).ToArray();
        var imageUsers = await _db.ImageUsers.AsNoTracking().Where(x => imageIds.Contains(x.ImageId)).ToListAsync(ct);
        var userIds = imageUsers.Select(x => x.UserId).Distinct().ToArray();
        var users = await _db.Users.AsNoTracking().Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct);
        var imgUsersByImg = imageUsers.GroupBy(iu => iu.ImageId).ToDictionary(g => g.Key, g => g.ToList());
        var data = images.Select(i =>
        {
            var ius = imgUsersByImg.TryGetValue(i.Id, out var lst) ? lst : new List<Shared.Domain.Images.ImageUser>();
            var usDto = ius.Select(u => ToUserDto(users, u.UserId, u.Role));
            return new ImageDto(i.Id, i.Name, usDto);
        });
        return Ok(ApiResponse.Success(data, "Images retrieved successfully."));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Store(long projectId, long batchId, [FromBody] CreateImageRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(ApiResponse.Failure<object>("Image name is required."));
        var batchExists = await _db.Batches.AnyAsync(b => b.Id == batchId && b.ProjectId == projectId, ct);
        if (!batchExists) return NotFound(ApiResponse.Failure<object>("Batch not found."));
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        var image = new Shared.Domain.Images.Image { Name = req.Name.Trim(), BatchId = batchId };
        await _db.Images.AddAsync(image, ct);
        await _db.SaveChangesAsync(ct);

        var imageUsers = req.Users is { Length: > 0 }
            ? req.Users.Select(ur => new ImageUserEntity
            {
                ImageId = image.Id,
                UserId = ur.UserId,
                Role = ParseRole(ur.Role)
            }).ToList()
            : new List<ImageUserEntity>();

        if (imageUsers.Count > 0)
        {
            await _db.ImageUsers.AddRangeAsync(imageUsers, ct);
        }

        var generatedTasks = await BuildTasksFromBatchCalculator(projectId, batchId, image.Id, ct);
        if (generatedTasks.Count > 0)
        {
            await _db.Tasks.AddRangeAsync(generatedTasks, ct);
        }

        if (imageUsers.Count > 0 || generatedTasks.Count > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        await transaction.CommitAsync(ct);
        return StatusCode(201, ApiResponse.Success<object>(new { image.Id, image.Name }, "Image created successfully."));
    }

    [HttpGet("{imageId:long}")]
    public async Task<ActionResult<ApiResponse<ImageDto>>> Show(long projectId, long batchId, long imageId, CancellationToken ct)
    {
        var image = await _db.Images.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == imageId && i.BatchId == batchId, ct);
        var batchOk = await _db.Batches.AnyAsync(b => b.Id == batchId && b.ProjectId == projectId, ct);
        if (image == null || !batchOk) return NotFound(ApiResponse.Failure<ImageDto>("Image not found."));

        var imgUsers = await _db.ImageUsers.AsNoTracking().Where(x => x.ImageId == imageId).ToListAsync(ct);
        var users = await _db.Users.AsNoTracking().Where(u => imgUsers.Select(x => x.UserId).Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct);
        var usDto = imgUsers.Select(u => ToUserDto(users, u.UserId, u.Role));
        return Ok(ApiResponse.Success(new ImageDto(image.Id, image.Name, usDto), "Image retrieved successfully."));
    }

    [HttpPut("{imageId:long}")]
    public async Task<ActionResult<ApiResponse<object>>> Update(long projectId, long batchId, long imageId, [FromBody] UpdateImageRequest req, CancellationToken ct)
    {
        var image = await _db.Images.FirstOrDefaultAsync(i => i.Id == imageId && i.BatchId == batchId, ct);
        var batchOk = await _db.Batches.AnyAsync(b => b.Id == batchId && b.ProjectId == projectId, ct);
        if (image == null || !batchOk) return NotFound(ApiResponse.Failure<object>("Image not found."));

        if (req.Name != null)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(ApiResponse.Failure<object>("Image name cannot be empty."));
            image.Name = req.Name.Trim();
        }
        await _db.SaveChangesAsync(ct);

        if (req.Users != null)
        {
            // Полная синхронизация пользователей для картинки
            var current = await _db.ImageUsers.Where(x => x.ImageId == image.Id).ToListAsync(ct);
            _db.ImageUsers.RemoveRange(current);
            if (req.Users.Length > 0)
            {
                var toAdd = req.Users.Select(ur => new Shared.Domain.Images.ImageUser
                {
                    ImageId = image.Id,
                    UserId = ur.UserId,
                    Role = ParseRole(ur.Role)
                }).ToList();
                await _db.ImageUsers.AddRangeAsync(toAdd, ct);
            }
            await _db.SaveChangesAsync(ct);
        }

        return Ok(ApiResponse.Success<object>(new { image.Id, image.Name }, "Image updated successfully."));
    }

    [HttpDelete("{imageId:long}")]
    public async Task<ActionResult<ApiResponse<object?>>> Destroy(long projectId, long batchId, long imageId, CancellationToken ct)
    {
        var image = await _db.Images.FirstOrDefaultAsync(i => i.Id == imageId && i.BatchId == batchId, ct);
        var batchOk = await _db.Batches.AnyAsync(b => b.Id == batchId && b.ProjectId == projectId, ct);
        if (image == null || !batchOk) return NotFound(ApiResponse.Failure<object?>("Image not found."));
        _db.Images.Remove(image);
        await _db.SaveChangesAsync(ct);
        return Ok(ApiResponse.Success<object?>(null, "Image deleted successfully."));
    }

    private static ParticipantRole ParseRole(string role)
    {
        return role?.ToLower() switch
        {
            "modeller" => ParticipantRole.Modeller,
            "freelancer" => ParticipantRole.Freelancer,
            "artist" => ParticipantRole.Artist,
            "art_director" => ParticipantRole.Art_Director,
            "project_manager" => ParticipantRole.Project_Manager,
            _ => ParticipantRole.Artist
        };
    }

    private static UserDto ToUserDto(IReadOnlyDictionary<long, User> users, long userId, ParticipantRole role)
    {
        var roleString = role.ToString().ToLowerInvariant();
        return users.TryGetValue(userId, out var user)
            ? new UserDto(user.Id, user.Name, roleString)
            : new UserDto(userId, "unknown", roleString);
    }

    private async Task<List<TaskEntity>> BuildTasksFromBatchCalculator(long projectId, long batchId, long imageId, CancellationToken ct)
    {
        var calculator = await _db.BatchCalculators
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.BatchId == batchId && x.ProjectId == projectId, ct);

        if (calculator == null || calculator.StatusDurations == null || calculator.StatusDurations.Count == 0)
        {
            return new List<TaskEntity>();
        }

        var batch = await _db.Batches
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == batchId && x.ProjectId == projectId, ct);

        if (batch == null)
        {
            return new List<TaskEntity>();
        }

        var durations = calculator.StatusDurations
            .Where(sd => sd.Status > 0 && sd.Duration > 0)
            .ToList();

        if (durations.Count == 0) return new List<TaskEntity>();

        var cursor = batch.BatchDate == default
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : batch.BatchDate;
        var tasks = new List<TaskEntity>();

        foreach (var item in durations)
        {
            // Создаем задачи только на рабочие дни, пропуская выходные
            var businessDays = GetBusinessDays(cursor, item.Duration);
            
            // Группируем смежные рабочие дни в сегменты (разделяя выходными)
            var segments = GroupBusinessDaysIntoSegments(businessDays);
            
            foreach (var segment in segments)
            {
                tasks.Add(new TaskEntity
                {
                    ProjectId = projectId,
                    BatchId = batchId,
                    ImageId = imageId,
                    StatusId = item.Status,
                    StartDate = segment.Start,
                    DueDate = segment.End,
                    EndDate = segment.End,
                    Completed = false
                });
            }
            
            // Следующий статус начинается со следующего рабочего дня после последнего
            if (businessDays.Count > 0)
            {
                cursor = MoveToNextBusinessDay(businessDays.Last().AddDays(1));
            }
        }

        return tasks;
    }

    private static List<DateOnly> GetBusinessDays(DateOnly seed, int duration)
    {
        if (duration <= 0) throw new ArgumentOutOfRangeException(nameof(duration), "Duration must be greater than zero.");

        var businessDays = new List<DateOnly>();
        var current = IsWeekend(seed) ? MoveToNextBusinessDay(seed) : seed;
        
        for (int i = 0; i < duration; i++)
        {
            businessDays.Add(current);
            // Переходим к следующему рабочему дню
            current = current.AddDays(1);
            if (IsWeekend(current))
            {
                current = MoveToNextBusinessDay(current);
            }
        }

        return businessDays;
    }

    private static List<(DateOnly Start, DateOnly End)> GroupBusinessDaysIntoSegments(List<DateOnly> businessDays)
    {
        if (businessDays.Count == 0) return new List<(DateOnly, DateOnly)>();

        var segments = new List<(DateOnly Start, DateOnly End)>();
        var segmentStart = businessDays[0];
        var segmentEnd = businessDays[0];

        for (int i = 1; i < businessDays.Count; i++)
        {
            var current = businessDays[i];
            var previous = businessDays[i - 1];
            
            // Если текущий день не следующий день после предыдущего (есть разрыв из-за выходных)
            if (current != previous.AddDays(1))
            {
                // Завершаем текущий сегмент
                segments.Add((segmentStart, segmentEnd));
                // Начинаем новый сегмент
                segmentStart = current;
                segmentEnd = current;
            }
            else
            {
                // Продолжаем текущий сегмент
                segmentEnd = current;
            }
        }

        // Добавляем последний сегмент
        segments.Add((segmentStart, segmentEnd));

        return segments;
    }

    private static bool IsWeekend(DateOnly date)
    {
        return date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
    }

    private static DateOnly MoveToNextBusinessDay(DateOnly date)
    {
        var cursor = date;
        while (IsWeekend(cursor))
        {
            cursor = cursor.AddDays(1);
        }

        return cursor;
    }
}


