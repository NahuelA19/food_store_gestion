export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'start-case', 'pascal-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'type-case': [2, 'always', 'lowercase'],
    'type-empty': [2, 'never'],
  },
};
