const commander = require('commander');
const program = new commander.Command();
const programsCommand = program
  .command('programs')

const deployCommand = programsCommand.command('deploy').action(() => {
    console.log('Deploying programs...');
})

program.parse(process.argv);