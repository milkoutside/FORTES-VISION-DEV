
const state = {
    currentViewDate: new Date(),
}

const mutations = {
    GO_TO_PREVIOUS_MONTH(state) {
        const newDate = new Date(state.currentViewDate)
        newDate.setMonth(newDate.getMonth() - 1)
        state.currentViewDate = newDate
    },

    // Переход к следующему месяцу
    GO_TO_NEXT_MONTH(state) {
        const newDate = new Date(state.currentViewDate)
        newDate.setMonth(newDate.getMonth() + 1)
        state.currentViewDate = newDate
    },

    // Переход на 3 месяца назад
    GO_TO_PREVIOUS_THREE_MONTHS(state) {
        const newDate = new Date(state.currentViewDate)
        newDate.setMonth(newDate.getMonth() - 3)
        state.currentViewDate = newDate
    },

    // Переход на 3 месяца вперед
    GO_TO_NEXT_THREE_MONTHS(state) {
        const newDate = new Date(state.currentViewDate)
        newDate.setMonth(newDate.getMonth() + 3)
        state.currentViewDate = newDate
    },

    SET_CURRENT_VIEW_DATE(state, date) {
        state.currentViewDate = date
    },
}

const actions = {
    goToPreviousMonth({ commit }) {
        commit('GO_TO_PREVIOUS_MONTH')
    },
    goToNextMonth({ commit }) {
        commit('GO_TO_NEXT_MONTH')
    },

    // Переход на 3 месяца назад
    goToPreviousThreeMonths({ commit }) {
        commit('GO_TO_PREVIOUS_THREE_MONTHS')
    },

    // Переход на 3 месяца вперед
    goToNextThreeMonths({ commit }) {
        commit('GO_TO_NEXT_THREE_MONTHS')
    },
}

const getters = {
    currentViewDate: state => state.currentViewDate,

    // Текущий месяц (средний из трех)
    currentMonthName: state => {
        const month = state.currentViewDate.toLocaleString('en-US', { month: 'long' });
        return month.charAt(0).toUpperCase() + month.slice(1);
    },

    // Текущий год
    currentYear: state => state.currentViewDate.getFullYear(),

    // Массив из 3 месяцев: предыдущий, текущий, следующий
    threeMonthsData: state => {
        const currentDate = new Date(state.currentViewDate)
        const months = []

        // Создаем массив для трех месяцев
        for (let i = -1; i <= 1; i++) {
            const monthDate = new Date(currentDate)
            monthDate.setMonth(currentDate.getMonth() + i)

            const year = monthDate.getFullYear()
            const month = monthDate.getMonth()
            const daysCount = new Date(year, month + 1, 0).getDate()

            const dates = []
            for (let day = 1; day <= daysCount; day++) {
                // Используем UTC чтобы избежать проблем с часовыми поясами
                const date = new Date(Date.UTC(year, month, day))
                dates.push(date.toISOString().split('T')[0]) // Формат YYYY-MM-DD
            }

            months.push({
                year: year,
                month: month,
                monthName: monthDate.toLocaleString('en-US', { month: 'long' }),
                dates: dates,
                monthYear: `${monthDate.toLocaleString('en-US', { month: 'long' })} ${year}`
            })
        }

        return months
    },

    // Предыдущий месяц
    previousMonth: (state, getters) => getters.threeMonthsData[0],

    // Текущий месяц
    currentMonth: (state, getters) => getters.threeMonthsData[1],

    // Следующий месяц
    nextMonth: (state, getters) => getters.threeMonthsData[2],

    // Все даты из трех месяцев в одном массиве
    allDatesInThreeMonths: (state, getters) => {
        return getters.threeMonthsData.reduce((acc, month) => {
            return acc.concat(month.dates)
        }, [])
    },

    // Оставляем старый геттер для обратной совместимости
    datesInMonth: state => {
        const year = state.currentViewDate.getFullYear()
        const month = state.currentViewDate.getMonth()
        const daysCount = new Date(year, month + 1, 0).getDate()

        const dates = []
        for (let i = 1; i <= daysCount; i++) {
            // Используем UTC чтобы избежать проблем с часовыми поясами
            const date = new Date(Date.UTC(year, month, i))
            dates.push(date.toISOString().split('T')[0])
        }

        return dates
    },
    firstDateInThreeMonths: (state, getters) => {
        const previousMonth = getters.previousMonth;
        return previousMonth.dates[0]; // Первая дата предыдущего месяца
    },

    // Последняя дата из трех месяцев (последнее число следующего месяца)
    lastDateInThreeMonths: (state, getters) => {
        const nextMonth = getters.nextMonth;
        return nextMonth.dates[nextMonth.dates.length - 1]; // Последняя дата следующего месяца
    },

    // Альтернативный способ - получить первую и последнюю дату из всех дат
    firstAndLastDateInThreeMonths: (state, getters) => {
        const allDates = getters.allDatesInThreeMonths;
        return {
            firstDate: allDates[0],
            lastDate: allDates[allDates.length - 1]
        };
    },
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}
