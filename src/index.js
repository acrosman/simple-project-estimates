import './style.css';
import { setupUi } from './ui/layout';
import { startSimulation } from './ui/simulation-handler';

// Initialize app if DOM element exists
const projectSimulator = document.getElementById('project-simulator');
if (projectSimulator) {
  projectSimulator.appendChild(setupUi());

  const startSimulationButton = document.getElementById('startSimulationButton');
  if (startSimulationButton) {
    startSimulationButton.addEventListener('click', startSimulation);
  }
}
