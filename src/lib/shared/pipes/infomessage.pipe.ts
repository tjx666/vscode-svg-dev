import { Pipe } from "@/common/pipe/pipe";
import { HintsDict } from "../hints/hints.dict";

export type InfomessageRequest = keyof HintsDict;
export type InfomessageResponse = {};
export const infomessagePipe = new Pipe<InfomessageRequest, InfomessageResponse, 'infomessage'>('infomessage');
