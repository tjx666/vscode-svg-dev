import { Pipe } from "../../lib/common/pipe/pipe";

export const groupPipe = new Pipe<'group' | 'ungroup', {}, 'group'>('group');
