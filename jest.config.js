export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  transform: {
    '^.+\\.m?jsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react'
      ]
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-kapsule|jerrypick)/)'
  ],
  testPathIgnorePatterns: ['/node_modules/', 'setup\\.js$'],
  moduleNameMapper: {
    '^force-graph$': '<rootDir>/src/__mocks__/force-graph.js',
    '^3d-force-graph$': '<rootDir>/src/__mocks__/3d-force-graph.js',
    '^3d-force-graph-vr$': '<rootDir>/src/__mocks__/3d-force-graph-vr.js',
    '^3d-force-graph-ar$': '<rootDir>/src/__mocks__/3d-force-graph-ar.js',
    '^three$': '<rootDir>/src/__mocks__/three.js'
  }
};
