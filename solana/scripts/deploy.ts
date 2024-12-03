import { spawn } from "node:child_process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

type SpawnProcessResult = {
	promise: Promise<void>; // For awaiting the process completion
	stdout: NodeJS.ReadableStream; // To handle stdout
	stderr: NodeJS.ReadableStream; // To handle stderr
};

const spawnProcess = (command: string, args: string[]): SpawnProcessResult => {
	const deploy = spawn(command, args);

	const promise = new Promise<void>((resolve, reject) => {
		deploy.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`child process exited with code ${code}`));
			}
		});

		deploy.on("error", (err) => {
			reject(err); // In case spawn fails to start the process
		});
	});

	// Return the promise along with stdout and stderr streams
	return {
		promise,
		stdout: deploy.stdout,
		stderr: deploy.stderr,
	};
};

yargs(hideBin(process.argv))
.command('deploy', 'Deploy Effect Contracts to a cluster', (yargs) => {
    yargs.positional('name', {
      type: 'string',
      default: 'Cambi',
      describe: 'the name to say hello to'
    })
  }, (argv) => {
    console.log('hello', argv.name, 'welcome to yargs!')
  })
.help()
.argv;
