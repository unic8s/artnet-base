/// <reference types="node" />
import * as net from 'net';
export declare enum ArtOpCode {
    OpPoll = 8192,
    OpPollReply = 8448,
    OpNzs = 20736,
    OpDmx = 20480
}
export declare abstract class ArtnetPackage {
    id: number[];
    opCode: ArtOpCode;
    protocolVersionHigh: number;
    protocolVersionLow: number;
    get header(): number[];
    get package(): number[];
    abstract get body(): number[];
    protected hi(bytes: number): number;
    protected lo(bytes: number): number;
}
export declare class ArtnetDmxPackage extends ArtnetPackage {
    sequence: number;
    physical: number;
    universe: number;
    data: number[];
    get body(): number[];
}
export interface ArtnetSenderConfig {
    debug?: boolean;
    networkInterface: string;
}
export declare class ArtnetSender {
    config: ArtnetSenderConfig;
    constructor(config: ArtnetSenderConfig);
    bind(interfaceAddress: string): Promise<void>;
    send(host: string, universe: number, data: number[]): Promise<number>;
    close(): void;
    socketAddress(): net.AddressInfo;
    private readonly _socket;
    private readonly _networkInterface;
    private readonly _port;
}
