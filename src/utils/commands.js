import { Command } from "commander";
const program = new Command()
program.option('--mode <mode>', 'Modo de ejecución', 'development')
program.parse()
export default program;