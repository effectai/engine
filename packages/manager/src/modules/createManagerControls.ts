import { TypedEventEmitter } from "@effectai/protocol-core";
import { createLogger } from "../logging";
import { ManagerEntity, ManagerEvents, ManagerSettings } from "../main";
import { TaskManager } from "./createTaskManager";

export const createManagerControls = ({
  entity,
  managerSettings,
  logger,
  taskManager,
  events,
}: {
  entity: ManagerEntity;
  events: TypedEventEmitter<ManagerEvents>;
  managerSettings: ManagerSettings;
  logger: ReturnType<typeof createLogger>;
  taskManager: TaskManager;
}) => {
  let isStarted = false;
  let isPaused = false;
  let cycle = 0;

  const pause = () => {
    logger.log.info("Pausing manager...");
    isPaused = true;
  };

  const resume = () => {
    logger.log.info("Resuming manager...");
    isPaused = false;
  };

  const getCycle = () => {
    return cycle;
  };

  const start = async () => {
    if (isStarted) {
      console.warn("Manager is already started.");
      return;
    }

    //start libp2p & http transports
    await entity.node.start();
    await entity.startHttp();

    console.log("Manager listening on:");

    for (const ma of entity.node.getMultiaddrs()) {
      console.log(ma.toString());
    }

    isStarted = true;
    events.safeDispatchEvent("manager:start");

    if (managerSettings.autoManage) {
      let isManaging = false;

      setInterval(async () => {
        if (isPaused || isManaging) return;
        isManaging = true;
        try {
          cycle++;
          await taskManager.manageTasks();
        } finally {
          isManaging = false;
        }
      }, 1000);
    }
  };

  const stop = async () => {
    //stop libp2p & http transports
    await entity.node.stop();
    await entity.stopHttp();

    isStarted = false;

    events.safeDispatchEvent("manager:stop");
  };

  return {
    getCycle,
    start,
    stop,
    pause,
    resume,

    cycle,
    isStarted,
    isPaused,
  };
};
