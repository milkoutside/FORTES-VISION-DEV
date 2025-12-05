# 📘 Руководство по миграции: Исправления скролла

## Цель документа

Если вам нужно применить эти исправления к другим компонентам или проектам, используйте этот гайд как чек-лист.

---

## 🔧 Шаблон исправления синхронизации скролла

### Компонент с календарем (Master)

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// Флаги состояния
const isProgrammaticScroll = ref(false);
const isAutoNavigating = ref(false);

const handleCalendarScroll = (event) => {
  const header = event.target;
  
  // Синхронизируем только если скролл НЕ программный
  if (!isProgrammaticScroll.value && !isAutoNavigating.value) {
    const targetScrollLeft = header.scrollLeft;
    const syncTarget = document.querySelector('.your-sync-target-class');
    
    if (syncTarget && Math.abs(syncTarget.scrollLeft - targetScrollLeft) > 1) {
      isProgrammaticScroll.value = true;
      syncTarget.scrollLeft = targetScrollLeft;
      
      requestAnimationFrame(() => {
        isProgrammaticScroll.value = false;
      });
    }
  }

  // Остальная логика (edge hold, навигация и т.д.)
  // ...
};

onMounted(() => {
  const header = document.getElementById('your-calendar-id');
  if (header) {
    header.addEventListener('scroll', handleCalendarScroll, { passive: true });
  }
});

onUnmounted(() => {
  const header = document.getElementById('your-calendar-id');
  if (header) {
    header.removeEventListener('scroll', handleCalendarScroll);
  }
});
</script>
```

### Компонент с ячейками/таймлайном (Slave)

```vue
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const containerRef = ref(null);
const isSyncingScroll = ref(false);

const syncWithCalendar = () => {
  if (isSyncingScroll.value) return;
  
  const calendarHeader = document.getElementById('your-calendar-id');
  if (calendarHeader && containerRef.value) {
    const targetScrollLeft = calendarHeader.scrollLeft;
    
    if (Math.abs(containerRef.value.scrollLeft - targetScrollLeft) > 1) {
      isSyncingScroll.value = true;
      containerRef.value.scrollLeft = targetScrollLeft;
      
      requestAnimationFrame(() => {
        isSyncingScroll.value = false;
      });
    }
  }
};

const handleContainerScroll = (event) => {
  if (isSyncingScroll.value) return;
  
  const calendarHeader = document.getElementById('your-calendar-id');
  if (calendarHeader) {
    const targetScrollLeft = event.target.scrollLeft;
    
    if (Math.abs(calendarHeader.scrollLeft - targetScrollLeft) > 1) {
      isSyncingScroll.value = true;
      calendarHeader.scrollLeft = targetScrollLeft;
      
      requestAnimationFrame(() => {
        isSyncingScroll.value = false;
      });
    }
  }
};

onMounted(() => {
  const calendarHeader = document.getElementById('your-calendar-id');
  if (calendarHeader) {
    calendarHeader.addEventListener('scroll', syncWithCalendar);
  }
  
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleContainerScroll);
  }
  
  nextTick(() => {
    syncWithCalendar();
  });
});

onUnmounted(() => {
  const calendarHeader = document.getElementById('your-calendar-id');
  if (calendarHeader) {
    calendarHeader.removeEventListener('scroll', syncWithCalendar);
  }
  
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleContainerScroll);
  }
});
</script>

<template>
  <div ref="containerRef" class="your-container-class">
    <!-- Ваш контент -->
  </div>
</template>
```

---

## ✅ Чек-лист миграции

### Шаг 1: Определите компоненты

- [ ] Найдите компонент календаря (master)
- [ ] Найдите компонент(ы) ячеек/таймлайна (slave)
- [ ] Определите ID/классы для синхронизации

### Шаг 2: Добавьте флаги в Master компонент

- [ ] Добавьте `const isProgrammaticScroll = ref(false)`
- [ ] Добавьте `const isAutoNavigating = ref(false)` (если есть навигация)
- [ ] Добавьте `const userActive = computed(...)` (если есть edge hold)

### Шаг 3: Обновите обработчик скролла в Master

- [ ] Добавьте проверку `!isProgrammaticScroll.value` перед синхронизацией
- [ ] Добавьте порог `Math.abs(...) > 1`
- [ ] Установите флаг перед обновлением: `isProgrammaticScroll.value = true`
- [ ] Сбросьте флаг через `requestAnimationFrame(() => { isProgrammaticScroll.value = false })`

### Шаг 4: Добавьте флаги в Slave компонент

- [ ] Добавьте `const isSyncingScroll = ref(false)` (или `let isSyncingScroll = false`)

### Шаг 5: Обновите методы синхронизации в Slave

- [ ] Добавьте проверку `if (isSyncingScroll.value) return` в начало каждой функции
- [ ] Добавьте порог `Math.abs(...) > 1`
- [ ] Установите флаг перед обновлением: `isSyncingScroll.value = true`
- [ ] Сбросьте флаг через `requestAnimationFrame(() => { isSyncingScroll.value = false })`

### Шаг 6: Упростите инициализацию

- [ ] Удалите множественные `setTimeout` при монтировании
- [ ] Оставьте один вызов синхронизации в `nextTick(() => { ... })`

### Шаг 7: Исправьте scrollToToday (если есть)

- [ ] Добавьте `const waitForFrame = () => new Promise(...)`
- [ ] Добавьте `const ensureTodayInRange = async () => { ... }`
- [ ] Добавьте `const findTodayCell = async () => { ... }`
- [ ] Обновите `scrollToToday` чтобы использовать эти функции
- [ ] Добавьте установку флага `isProgrammaticScroll.value = true`
- [ ] Добавьте двойной `requestAnimationFrame` для сброса флага

### Шаг 8: Проверьте passive флаги

- [ ] `scroll` обработчики должны быть `{ passive: true }`
- [ ] `wheel` обработчики должны быть `{ passive: false }` (если нужен preventDefault)

### Шаг 9: Тестирование

- [ ] Скролл календаря
- [ ] Скролл ячеек/таймлайна
- [ ] Открытие/закрытие элементов
- [ ] Навигация по месяцам
- [ ] scrollToToday
- [ ] Edge hold (если есть)
- [ ] Быстрые операции подряд

---

## 🔑 Ключевые паттерны

### 1. Флаг программного скролла

```javascript
// Перед программным скроллом
isProgrammaticScroll.value = true;
element.scrollLeft = newValue;

// Сброс через requestAnimationFrame
requestAnimationFrame(() => {
  isProgrammaticScroll.value = false;
});
```

### 2. Порог синхронизации

```javascript
// Порог в 1px для избежания микроколебаний
if (Math.abs(element.scrollLeft - targetValue) > 1) {
  // Выполняем синхронизацию
}
```

### 3. Защита от циклов

```javascript
const handleScrollA = (event) => {
  if (isSyncing.value) return; // Защита
  
  isSyncing.value = true;
  elementB.scrollLeft = event.target.scrollLeft;
  requestAnimationFrame(() => {
    isSyncing.value = false;
  });
};

const handleScrollB = (event) => {
  if (isSyncing.value) return; // Защита
  
  isSyncing.value = true;
  elementA.scrollLeft = event.target.scrollLeft;
  requestAnimationFrame(() => {
    isSyncing.value = false;
  });
};
```

### 4. Асинхронная проверка диапазона

```javascript
const scrollToToday = async () => {
  // 1. Убедиться что сегодня в диапазоне
  await ensureTodayInRange();
  
  // 2. Дождаться рендеринга ячейки
  const cell = await findTodayCell();
  if (!cell) return;
  
  // 3. Выполнить программный скролл с флагом
  isProgrammaticScroll.value = true;
  await performScroll(cell);
  
  // 4. Сбросить флаг
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isProgrammaticScroll.value = false;
    });
  });
  
  // 5. Fallback таймаут
  setTimeout(() => {
    isProgrammaticScroll.value = false;
  }, 400);
};
```

---

## 🚨 Типичные ошибки

### ❌ Ошибка 1: Нет защиты от циклов

```javascript
// ПЛОХО: циклическая синхронизация
const handleScrollA = (event) => {
  elementB.scrollLeft = event.target.scrollLeft;
};

const handleScrollB = (event) => {
  elementA.scrollLeft = event.target.scrollLeft;
};
```

**Результат:** Бесконечные обновления, зависания, рывки

### ❌ Ошибка 2: setTimeout вместо requestAnimationFrame

```javascript
// ПЛОХО: race conditions
setTimeout(() => {
  isProgrammaticScroll.value = false;
}, 50); // Может сработать раньше или позже рендеринга
```

**Результат:** Рассинхронизация, пропущенные обновления

### ❌ Ошибка 3: Нет порога синхронизации

```javascript
// ПЛОХО: синхронизация даже при микроразнице
if (elementA.scrollLeft !== elementB.scrollLeft) {
  elementB.scrollLeft = elementA.scrollLeft;
}
```

**Результат:** Постоянные микрообновления, плохая производительность

### ❌ Ошибка 4: Множественные setTimeout при инициализации

```javascript
// ПЛОХО: race conditions
setTimeout(() => sync(), 100);
setTimeout(() => sync(), 500);
setTimeout(() => sync(), 1000);
```

**Результат:** Непредсказуемое поведение, лишние обновления

---

## 📊 Сравнение: До и После

### До исправлений:

```javascript
// Master
const handleScroll = (event) => {
  slave.scrollLeft = event.target.scrollLeft;
};

// Slave
const handleScroll = (event) => {
  master.scrollLeft = event.target.scrollLeft;
};
```

**Проблемы:**
- Циклы обновлений
- Рывки при изменении данных
- Нет различия между пользовательским и программным скроллом

### После исправлений:

```javascript
// Master
const isProgrammaticScroll = ref(false);

const handleScroll = (event) => {
  if (!isProgrammaticScroll.value) {
    if (Math.abs(slave.scrollLeft - event.target.scrollLeft) > 1) {
      isProgrammaticScroll.value = true;
      slave.scrollLeft = event.target.scrollLeft;
      requestAnimationFrame(() => {
        isProgrammaticScroll.value = false;
      });
    }
  }
};

// Slave
const isSyncingScroll = ref(false);

const handleScroll = (event) => {
  if (!isSyncingScroll.value) {
    if (Math.abs(master.scrollLeft - event.target.scrollLeft) > 1) {
      isSyncingScroll.value = true;
      master.scrollLeft = event.target.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.value = false;
      });
    }
  }
};
```

**Результат:**
- ✅ Нет циклов
- ✅ Плавная синхронизация
- ✅ Стабильная работа при любых операциях

---

## 🎓 Дополнительные ресурсы

### Примеры реализации:

1. **Projects CalendarHeader**
   - Полная реализация с edge hold и навигацией
   - См. `Frontends/Projects/src/components/calendar/CalendarHeader.vue`

2. **Projects CalendarCells**
   - Двусторонняя синхронизация с защитой
   - См. `Frontends/Projects/src/components/calendar/CalendarCells.vue`

3. **Employees WorkloadTimeline**
   - Синхронизация таймлайна с календарем
   - См. `Frontends/Employees/src/components/workloads/WorkloadTimeline.vue`

### Документация:

- [SCROLL_FIXES.md](./SCROLL_FIXES.md) - детальное описание всех изменений
- [QUICK_START_SCROLL.md](./QUICK_START_SCROLL.md) - быстрый старт и тестирование

---

## 💡 Советы

1. **Начните с простого**
   - Сначала добавьте флаги и базовую защиту
   - Затем оптимизируйте с порогами и requestAnimationFrame

2. **Тестируйте пошагово**
   - После каждого изменения проверяйте работоспособность
   - Используйте Vue DevTools для отладки

3. **Документируйте изменения**
   - Комментируйте нестандартные решения
   - Укажите причины использования флагов

4. **Не удаляйте старую логику сразу**
   - Закомментируйте старый код при первом тестировании
   - Удалите после подтверждения что новая версия работает

---

**Успешной миграции! 🚀**

