/**
 * @file stream services class
 */
// imports libraries

import { debounce } from 'lodash';
import EventEmitter from 'events';
import { Mutex } from 'await-semaphore';
import { setupMultiplexer } from '../../../../shared/libs';
import { createMetaRPCHandler } from '../../../../shared/libs';
import { ComposableObservableStore } from '../../../../shared/libs';
import { MILLISECOND } from '../../../../shared/constants/time';
import {
  ApprovalController,
  ControllerMessenger,
  NotificationController
} from '@blockits/controllers';

// StreamService Class
export class StreamService extends EventEmitter {
  /**
   * @constructor
   * @param {Object} opts
   */
  constructor(opts) {
    super();

    this.defaultMaxListener = 20;

    this.sendUpdate = debounce(
      this.privateSendUpdate.bind(this),
      MILLISECOND * 200,
    )
    // optionals setting to init StreamService
    this.opts = opts;
    // objects of data to be state
    const initState = opts.initState || {};

    // number of connection was established - modified by associated method
    this.activeConnections = 0;

    // connection from external - don't modify directly. Use the associated method
    this.connections = {};

    // lock to ensure only one vault create at once
    this.createVaultMutex = new Mutex();

    this.controllerMessenger = new ControllerMessenger();

    this.approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: opts.showUserConfiguration,
    });
    this.store =  new ComposableObservableStore({
      state: initState,
      controllerMessenger: this.controllerMessenger,
      persist: true,
    });
    
    // update current store with new Controller store
    this.store.updateStructure({

    });
    // create new memStore
    this.memStore = new ComposableObservableStore({
      config: {

      },
      controllerMessenger: this.controllerMessenger,
    });
    this.memStore.subscribe(this.sendUpdate.bind(this));

  }

  //
  // SETUP 
  //
  
  /**
   * 
   * @param {Duplex} connStream - The Duplex stream to connect to 
   * @param {Object} sender - the sender of the messages on this stream 
   */
  setupCommunicationBySender(connStream, sender) {
    const { hostname } = new URL(sender.url);
    // setup multiplexing
    const mux = setupMultiplexer(connStream);
    // connect features
    this.setupConnection(mux.createStream('controller', sender));
  }
  
  /**
   * 
   * @param {Duplex} connStream - The Duplex stream to connect to
   */
  setupCommonCommunication(connStream) {
    // setup multiplexing
    const mux = setupMultiplexer(connStream);
    // connect features
    this.setupConnection(mux.createStream('controller'));
  }

  /**
   * A method for providing API over a stream using JSON-RPC.
   * @param {Duplex} outStream - The stream to provide API over
   */
  setupConnection(outStream) {
    // get API List
    const api = this.getAPi();

    // report new active controller connection
    this.activeConnections += 1;
    this.emit('connectionChanged', this.activeConnections);
    
    // setup Stream transport & notification to client
    outStream.on('data', createMetaRPCHandler(api, outStream));
    const handleUpdate = (update) => {
      if (outStream._writableState.ended) {
        return;
      }
      // send notification to client-side
      outStream.write({
        jsonrpc: '2.0',
        method: 'sendUpdate',
        params: [update],
      });
    }
    this.on('update', handleUpdate);
    outStream.on('end', () => {
      this.activeConnections -= 1;
      this.emit(
        'connectionChanged',
        this.activeConnections,
      );
      this.removeListener('update', handleUpdate);
    });

  }

  /**
   * wallet-state of the various controllers, mad available to the UI
   * @returns {Object} status
   */
  getState() {
    const isInitialized = Boolean(this.store);

    return {
      isInitialized,
      ...this.memStore.getFlatState(),
    };
  }

  //
  // UI Expose
  //

  getApi() {
    const {
      approvalController
    } = this;
    return {
      // etc
      getState: this.getState.bind(this),
      // approval controller
      resolvePendingApproval: approvalController.accept.bind(
        approvalController,
      ),
      rejectPendingApproval: approvalController.reject.bind(approvalController),

    }
  }

  //
  // INTERNAL Manage
  //
  privateSendUpdate() {
    this.emit('update', this.getState());
  }

}