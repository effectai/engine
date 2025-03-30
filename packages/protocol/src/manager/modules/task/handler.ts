import type { PeerId } from "@libp2p/interface";
import type {
	EffectProtocolMessage,
	Task,
	TaskAccepted,
	TaskCompleted,
	TaskRejected,
} from "../../../common/proto/effect.js";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type {
	ManagerPaymentService,
	ManagerSessionService,
	ManagerTaskService,
} from "../../modules/index.js";
import { logger } from "../../../common/logging.js";
import type { MessageHandler } from "../../../common/router.js";
import { PublicKey } from "@solana/web3.js";
