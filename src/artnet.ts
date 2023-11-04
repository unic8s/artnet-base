import { createSocket, Socket } from 'dgram';
import * as net from 'net';

export enum ArtOpCode {
    OpPoll = 0x2000,
    OpPollReply = 0x2100,
    OpNzs = 0x5100,
    OpDmx = 0x5000,
}

export abstract class ArtnetPackage {
    id = 'Art-Net'.split( '' ).map( ( el ) => el.charCodeAt( 0 ) ).concat( 0x00 );
    opCode: ArtOpCode = ArtOpCode.OpDmx;
    protocolVersionHigh = 0;
    protocolVersionLow = 14;
    headerCache = this.header;

    get header(): number[] {
        return this.id.concat( [ this.lo( this.opCode ), this.hi( this.opCode ), this.protocolVersionHigh, this.protocolVersionLow ] );
    }

    get package(): number[] {
        return [...this.headerCache, ...this.body];
    }

    abstract get body(): number[];

    protected hi( bytes: number ) {
        return ( bytes >> 8 ) & 0xff;
    }

    protected lo( bytes: number ) {
        return bytes & 0xff;
    }
}

export class ArtnetDmxPackage extends ArtnetPackage {
    sequence = 0;
    physical = 0;
    universe = 0;
    data: number[] = [];

    get body(): number[] {
        return [
            this.sequence,
            this.physical,
            this.lo( this.universe ), // SubUni
            this.hi( this.universe ), // Net
            this.hi( this.data.length ),
            this.lo( this.data.length ),
            ...this.data
        ];
    }

}

export interface ArtnetSenderConfig {
    debug?: boolean;
    networkInterface: string;
}

export class ArtnetSender {

    constructor( public config: ArtnetSenderConfig ) {
        this._networkInterface = config.networkInterface;
        this._artDmx = new ArtnetDmxPackage();
        const socket = createSocket( {
            type: 'udp4',
            reuseAddr: true,
        } );

        socket.on( 'error', ( err: any ) => {
            console.error( 'Socket error:', err );
        } );

        if ( config.debug === true ) {
            socket.on( 'connect', () => console.info( 'Socket connected to remote address.' ) );
            socket.on( 'close', () => console.log( 'Socket closed.' ) );
            socket.on( 'listening', () => console.log( 'Socket is listening.' ) );
            socket.on( 'message', ( msg, rinfo ) => {
                console.log( `New message from ${rinfo.address} (${rinfo.family}), ${rinfo.size} B` )
            } );
        }

        this._socket = socket;
    }

    bind( interfaceAddress: string ): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            this._socket.bind( () => {
                try {
                    console.log( `Setting multicast interface to ${interfaceAddress}` );
                    this._socket.setMulticastInterface( interfaceAddress );
                    console.log( `Done; sending over interface with address ${interfaceAddress}.` );
                    resolve();
                } catch ( err ) {
                    reject( err );
                }
            } );
        } );
    }


    send( host: string, universe: number, data: number[] ) {
        this._artDmx.universe = universe;
        this._artDmx.data = data;

        const buf = Buffer.from( this._artDmx.package );
        this._socket.send( buf, 0, buf.length, this._port, host);
    }

    close() {
        this._socket.close();
    }

    socketAddress(): net.AddressInfo {
        return this._socket.address();
    }

    private readonly _socket: Socket;
    private readonly _networkInterface;
    private readonly _port = 6454;
}
