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
  let manageInterval: ReturnType<typeof setInterval> | null = null;

  const pause = () => {
    logger.log.info("Pausing manager...");
    isPaused = true;
  };

  const resume = () => {
    logger.log.info("Resuming manager...");
    isPaused = false;
  };

  const getCycle = () => cycle;
  const getIsStarted = () => isStarted;

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

      manageInterval = setInterval(async () => {
        if (!isStarted || isPaused || isManaging) return;
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

    if (manageInterval) {
      clearInterval(manageInterval);
      manageInterval = null;
    }

    events.safeDispatchEvent("manager:stop");
  };

  return {
    getCycle,
    getIsStarted,
    start,
    stop,
    pause,
    resume,

    cycle,
    isStarted,
    isPaused,
  };
};
