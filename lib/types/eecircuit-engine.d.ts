export declare type ComplexDataType = {
  name: string

  type: string

  values: ComplexNumber[]
}

export declare type ComplexNumber = {
  real: number

  img: number
}

/**

 * Read output from spice

 */

export declare type RealDataType = {
  name: string

  type: string

  values: RealNumber[]
}

export declare type RealNumber = number

export declare type ResultType =
  | {
      header: string

      numVariables: number

      variableNames: string[]

      numPoints: number

      dataType: "real"

      data: RealDataType[]
    }
  | {
      header: string

      numVariables: number

      variableNames: string[]

      numPoints: number

      dataType: "complex"

      data: ComplexDataType[]
    }

export declare class Simulation {
  private pass

  private commandList

  private cmd

  private dataRaw

  private results

  private output

  private info

  private initInfo

  private error

  private initialized

  private netList

  private initPromiseResolve

  private runPromiseResolve

  private getInput

  /**

     * Internal startup method that sets up the Module and simulation loop.

     */

  private startInternal

  /**

     * Public start method.

     * Returns a promise that resolves when the simulation module is initialized.

     */

  start: () => Promise<void>

  /**

     * Triggers a simulation run and returns a promise that resolves with the results.

     */

  runSim: () => Promise<ResultType>

  /**

     * Waits for a new simulation trigger.

     */

  private waitForNextRun

  /**

     * Resolves the waiting promise to continue the simulation loop.

     */

  private continueRun

  private outputEvent

  setNetList: (input: string) => void

  private setOutputEvent

  getInfo: () => string

  getInitInfo: () => string

  getError: () => string[]

  isInitialized: () => boolean

  private log_debug
}

export {}
