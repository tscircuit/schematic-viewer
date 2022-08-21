/**
 * Main entry point
 * @param {*} terminals List of terminals to use
 * @returns The RSMT for the given terminals
 */
declare function rsmt(terminals: any): Promise<{
    terminals: any;
    steiners: any[];
    edges: any[];
    edgeIds: any[];
    length: any;
}> | {
    terminals: any;
    steiners: never[];
    edges: never[];
    edgeIds: never[];
    length: number;
};

export { rsmt as default };
