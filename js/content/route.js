// The Trans-Siberian route: 5 legs, each 3 floors of stations + boss city.

export const LEGS = [
  {
    from: 'Москва', fromEn: 'Moscow', to: 'Казань', toEn: 'Kazan', boss: 'baba_yaga',
    stations: ['Владимир', 'Ковров', 'Вязники', 'Нижний Новгород', 'Семёнов', 'Шахунья', 'Котельнич', 'Чебоксары', 'Зеленодольск'],
    enemies: ['gopnik', 'kontroler', 'domovoi', 'komar'],
    elites: ['byurokrat', 'provodnitsa'],
    color: '#c8102e',
  },
  {
    from: 'Казань', fromEn: 'Kazan', to: 'Екатеринбург', toEn: 'Yekaterinburg', boss: 'mednaya',
    stations: ['Агрыз', 'Ижевск', 'Пермь', 'Кунгур', 'Шаля', 'Балезино', 'Глазов', 'Верещагино', 'Первоуральск'],
    enemies: ['volk', 'leshiy', 'gopnik', 'kontroler'],
    elites: ['byurokrat', 'kikimora'],
    color: '#b5651d',
  },
  {
    from: 'Екатеринбург', fromEn: 'Yekaterinburg', to: 'Новосибирск', toEn: 'Novosibirsk', boss: 'koshchey',
    stations: ['Тюмень', 'Ишим', 'Омск', 'Татарск', 'Барабинск', 'Каргат', 'Чулымская', 'Камышлов', 'Называевск'],
    enemies: ['medved', 'volk', 'komar', 'snegovik'],
    elites: ['provodnitsa', 'kikimora'],
    color: '#2f4f4f',
  },
  {
    from: 'Новосибирск', fromEn: 'Novosibirsk', to: 'Иркутск', toEn: 'Irkutsk', boss: 'gorynych',
    stations: ['Тайга', 'Мариинск', 'Ачинск', 'Красноярск', 'Канск', 'Тайшет', 'Нижнеудинск', 'Тулун', 'Зима'],
    enemies: ['medved', 'nerpa', 'leshiy', 'snegovik'],
    elites: ['byurokrat', 'tigr'],
    color: '#1d4e89',
  },
  {
    from: 'Иркутск', fromEn: 'Irkutsk', to: 'Владивосток', toEn: 'Vladivostok', boss: 'moroz',
    stations: ['Слюдянка', 'Улан-Удэ', 'Чита', 'Могоча', 'Сковородино', 'Белогорск', 'Биробиджан', 'Хабаровск', 'Уссурийск'],
    enemies: ['tigr_cub', 'metel', 'kontroler', 'medved'],
    elites: ['tigr', 'provodnitsa'],
    color: '#4b2e83',
  },
];

export const FLOORS_PER_LEG = 3;
