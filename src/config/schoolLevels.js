// src/config/schoolLevels.js
// Mapeamento entre idade da criança, ano escolar e
// níveis de dificuldade das atividades no BrotoSmart.
//
// ESTRUTURA DE NÍVEIS DE DIFICULDADE:
//   level 1 → Educação Infantil      (4–5 anos)
//   level 2 → 1º e 2º ano EF         (6–7 anos)
//   level 3 → 3º e 4º ano EF         (8–9 anos)
//   level 4 → 5º e 6º ano EF         (10–11 anos)
//   level 5 → 7º ano em diante       (12 anos)

const SCHOOL_LEVELS = [
  {
    ageMin:       4,
    ageMax:       5,
    level:        1,
    schoolYear:   'Educação Infantil',
    description:  'Pré-escola (4–5 anos)',
    seedsBonus:   1.0,   // multiplicador de sementes (nível base)
    levelLabel:   'Iniciante',
    color:        '#22c55e',
  },
  {
    ageMin:       6,
    ageMax:       7,
    level:        2,
    schoolYear:   '1º e 2º ano',
    description:  'Primeiros anos do Ensino Fundamental (6–7 anos)',
    seedsBonus:   1.2,
    levelLabel:   'Básico',
    color:        '#3b82f6',
  },
  {
    ageMin:       8,
    ageMax:       9,
    level:        3,
    schoolYear:   '3º e 4º ano',
    description:  'Ensino Fundamental I (8–9 anos)',
    seedsBonus:   1.5,
    levelLabel:   'Intermediário',
    color:        '#f59e0b',
  },
  {
    ageMin:       10,
    ageMax:       11,
    level:        4,
    schoolYear:   '5º e 6º ano',
    description:  'Ensino Fundamental II (10–11 anos)',
    seedsBonus:   1.8,
    levelLabel:   'Avançado',
    color:        '#8b5cf6',
  },
  {
    ageMin:       12,
    ageMax:       12,
    level:        5,
    schoolYear:   '7º ano +',
    description:  'Ensino Fundamental II avançado (12 anos)',
    seedsBonus:   2.0,
    levelLabel:   'Expert',
    color:        '#ef4444',
  },
];

/**
 * Retorna o nível escolar baseado na idade da criança.
 * @param {number} age — idade em anos
 * @returns {object} SchoolLevel
 */
function getLevelByAge(age) {
  const level = SCHOOL_LEVELS.find((l) => age >= l.ageMin && age <= l.ageMax);
  return level || SCHOOL_LEVELS[0]; // fallback para nível 1
}

/**
 * Retorna o número do nível de dificuldade (1–5) para uma idade.
 * @param {number} age
 * @returns {number}
 */
function getDifficultyLevel(age) {
  return getLevelByAge(age).level;
}

/**
 * Calcula o bônus de sementes baseado no nível escolar.
 * Crianças mais velhas ganham mais sementes por questão correta
 * pois as questões são mais difíceis.
 * @param {number} age
 * @param {number} baseSeedsReward — recompensa base da atividade
 * @returns {number} — sementes finais (arredondado)
 */
function calculateSeedsReward(age, baseSeedsReward) {
  const level = getLevelByAge(age);
  return Math.round(baseSeedsReward * level.seedsBonus);
}

module.exports = { SCHOOL_LEVELS, getLevelByAge, getDifficultyLevel, calculateSeedsReward };
