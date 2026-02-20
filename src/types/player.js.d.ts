declare module "player.js" {
  export class Player {
    constructor(iframe: HTMLIFrameElement);
    on(event: string, callback: (...args: any[]) => void): void;
    play(): void;
    pause(): void;
    getPaused(callback: (paused: boolean) => void): void;
    getCurrentTime(callback: (time: number) => void): void;
    setCurrentTime(seconds: number): void;
    getDuration(callback: (duration: number) => void): void;
    setVolume(volume: number): void;
    getVolume(callback: (volume: number) => void): void;
    mute(): void;
    unmute(): void;
    getMuted(callback: (muted: boolean) => void): void;
  }
}
