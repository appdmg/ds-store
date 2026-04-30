declare class DSStore {
  setBackgroundPath(path: string, options?: { volumeName?: string }): void;
  setBackgroundColor(red: number, green: number, blue: number): void;
  setIconSize(size: number): void;
  setIconPos(name: string, x: number, y: number): void;
  setWindowPos(x: number, y: number): void;
  setWindowSize(width: number, height: number): void;
  vSrn(value: 0 | 1): void;
  write(path: string): Promise<void>;
  write(path: string, callback: (error: Error | null) => void): void;

  /**
   * @deprecated Use setBackgroundPath instead.
   */
  setBackground(path: string, options?: { volumeName?: string }): void;
}

export = DSStore;
