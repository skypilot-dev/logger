module.exports = {
  hooks: {
    'pre-commit': 'git-branch-is -r "(^wip/)" 2>/dev/null || lint-staged',
  },
};
