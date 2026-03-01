/**
 * @jest-environment jsdom
 */

describe('index.js', () => {
  let sharedNode;
  let projectSimulator;
  let startSimulationButton;

  let mockStartSimulation;
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
    sharedNode = document.createElement('div');
    projectSimulator = document.createElement('div');
    projectSimulator.id = 'project-simulator';
    document.body.appendChild(projectSimulator);
    startSimulationButton = document.createElement('button');
    startSimulationButton.id = 'startSimulationButton';
    document.body.appendChild(startSimulationButton);
    jest.spyOn(projectSimulator, 'appendChild');
    jest.spyOn(startSimulationButton, 'addEventListener');
    jest.doMock('../ui/layout', () => ({ setupUi: jest.fn(() => sharedNode) }));
    mockStartSimulation = jest.fn();
    jest.doMock('../ui/simulation-handler', () => ({ startSimulation: mockStartSimulation }));
    delete require.cache[require.resolve('../index')];
  });

  test('should append setupUi and add event listener when elements exist', () => {
    expect(() => {
      // eslint-disable-next-line global-require
      require('../index');
    }).not.toThrow();
    expect(projectSimulator.appendChild).toHaveBeenCalledWith(sharedNode);
    expect(startSimulationButton.addEventListener).toHaveBeenCalledWith('click', mockStartSimulation);
  });

  test('should not add event listener if startSimulationButton is missing', () => {
    global.document.getElementById = jest.fn((id) => {
      if (id === 'project-simulator') return projectSimulator;
      if (id === 'startSimulationButton') return null;
      return null;
    });
    expect(() => {
      // eslint-disable-next-line global-require
      require('../index');
    }).not.toThrow();
    expect(projectSimulator.appendChild).toHaveBeenCalledWith(sharedNode);
  });
});
