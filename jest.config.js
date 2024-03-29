module.exports = {
    "roots": [
      "<rootDir>/src"
    ],
    "testPathIgnorePatterns": [
      "<rootDir>/src/service-menu",
    ],
    "testMatch": [
      "**/__tests__/**/*.+(ts|tsx|js)",
      "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
      "^.+\\.(ts|tsx)$": "ts-jest"
    },
    "testEnvironment": "node"
  }