<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <script src="https://kit.fontawesome.com/18c0fada45.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@1.0.0/primeicons.css">

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        .no-scroll {
            overflow-y: scroll; /* или auto */
            -ms-overflow-style: none;  /* IE и Edge */
            scrollbar-width: none;  /* Firefox */
        }

        .no-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
        }
    </style>

</head>
<body>
<div class="no-scroll" id="app">
</div>
</body>
</html>
