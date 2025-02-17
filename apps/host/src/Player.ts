import { FromHostMessage } from "@wired-labs/protocol";
import { Consumer } from "mediasoup/node/lib/Consumer";
import { DataConsumer } from "mediasoup/node/lib/DataConsumer";
import { DataProducer } from "mediasoup/node/lib/DataProducer";
import { Producer } from "mediasoup/node/lib/Producer";
import { RtpCapabilities, RtpParameters } from "mediasoup/node/lib/RtpParameters";
import { SctpStreamParameters } from "mediasoup/node/lib/SctpParameters";
import { Transport } from "mediasoup/node/lib/Transport";

import { Space } from "./Space";
import { SpaceRegistry } from "./SpaceRegistry";
import { uWebSocket } from "./types";

export class Player {
  ws: uWebSocket | null = null;
  #registry: SpaceRegistry;

  spaces = new Set<Space>();
  consumers = new Map<Space, Map<number, Consumer>>();
  dataConsumers = new Map<Space, Map<number, DataConsumer>>();

  #grounded = true;
  #name: string | null = null;
  #address: string | null = null;
  #avatar: string | null = null;

  #producer: Producer | null = null;
  #dataProducer: DataProducer | null = null;
  #rtpCapabilities: RtpCapabilities | null = null;

  consumerTransport: Transport | null = null;
  producerTransport: Transport | null = null;

  constructor(ws: uWebSocket, registry: SpaceRegistry) {
    this.ws = ws;
    this.#registry = registry;
  }

  send(message: FromHostMessage) {
    this.ws?.send(JSON.stringify(message));
  }

  get name() {
    return this.#name;
  }

  set name(name: string | null) {
    this.#name = name;
    this.spaces.forEach((space) => space.setName(this, name));
  }

  get grounded() {
    return this.#grounded;
  }

  set grounded(grounded: boolean) {
    this.#grounded = grounded;
    this.spaces.forEach((space) => space.setGrounded(this, grounded));
  }

  get address() {
    return this.#address;
  }

  set address(address: string | null) {
    this.#address = address;
    this.spaces.forEach((space) => space.setAddress(this, address));
  }

  get avatar() {
    return this.#avatar;
  }

  set avatar(avatar: string | null) {
    this.#avatar = avatar;
    this.spaces.forEach((space) => space.setAvatar(this, avatar));
  }

  get rtpCapabilities() {
    return this.#rtpCapabilities;
  }

  set rtpCapabilities(rtpCapabilities: RtpCapabilities | null) {
    this.#rtpCapabilities = rtpCapabilities;
    if (this.consumerTransport) this.#startConsuming();
  }

  get producer() {
    return this.#producer;
  }

  set producer(producer: Producer | null) {
    this.#producer = producer;
    if (producer) this.spaces.forEach((space) => space.setProducer(this, producer));
  }

  get dataProducer() {
    return this.#dataProducer;
  }

  set dataProducer(dataProducer: DataProducer | null) {
    this.#dataProducer = dataProducer;
    if (dataProducer) this.spaces.forEach((space) => space.setDataProducer(this, dataProducer));
  }

  join(spaceId: number) {
    const space = this.#registry.getOrCreateSpace(spaceId);
    if (this.spaces.has(space)) return;

    space.join(this);
    this.spaces.add(space);

    const playerId = space.playerId(this);
    if (playerId === undefined) return;

    this.ws?.subscribe(space.topic);

    this.send({ subject: "join_success", data: { spaceId, playerId } });
  }

  leave(spaceId: number) {
    const space = this.#registry.getSpace(spaceId);
    if (!space) return;

    this.ws?.unsubscribe(space.topic);

    space.leave(this);
    this.spaces.delete(space);

    const consumers = this.consumers.get(space);
    if (consumers) {
      consumers.forEach((consumer) => consumer.close());
      this.consumers.delete(space);
    }

    const dataConsumers = this.dataConsumers.get(space);
    if (dataConsumers) {
      dataConsumers.forEach((dataConsumer) => dataConsumer.close());
      this.dataConsumers.delete(space);
    }
  }

  chat(message: string) {
    this.spaces.forEach((space) => space.chat(this, message));
  }

  setTransport(type: "producer" | "consumer", transport: Transport) {
    if (type === "producer") {
      this.producerTransport = transport;
    } else {
      this.consumerTransport = transport;
      if (this.rtpCapabilities) this.#startConsuming();
    }
  }

  async produce(rtpParameters: RtpParameters) {
    if (!this.producerTransport) return;

    try {
      this.producer = await this.producerTransport.produce({ kind: "audio", rtpParameters });
      this.send({ subject: "producer_id", data: this.producer.id });
    } catch (err) {
      console.warn(err);
    }
  }

  async produceData(sctpStreamParameters: SctpStreamParameters) {
    if (!this.producerTransport) return;

    try {
      this.dataProducer = await this.producerTransport.produceData({ sctpStreamParameters });
      this.send({ subject: "data_producer_id", data: this.dataProducer.id });
    } catch (err) {
      console.warn(err);
    }
  }

  async consume(producer: Producer, spaceId: number, playerId: number) {
    if (!this.consumerTransport || !this.rtpCapabilities) return;

    try {
      const consumer = await this.consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities: this.rtpCapabilities,
        paused: true,
      });

      const space = this.#registry.getSpace(spaceId);
      if (!space) return;

      const consumers = this.consumers.get(space) ?? new Map();
      this.consumers.set(space, consumers);

      consumers.set(playerId, consumer);

      this.send({
        subject: "create_consumer",
        data: {
          playerId,
          consumerId: consumer.id,
          producerId: producer.id,
          rtpParameters: consumer.rtpParameters,
        },
      });
    } catch (err) {
      console.warn(err);
    }
  }

  async consumeData(dataProducer: DataProducer, spaceId: number, playerId: number) {
    if (!this.consumerTransport) return;

    try {
      const dataConsumer = await this.consumerTransport.consumeData({
        dataProducerId: dataProducer.id,
      });
      if (!dataConsumer.sctpStreamParameters) return;

      const space = this.#registry.getSpace(spaceId);
      if (!space) return;

      const dataConsumers = this.dataConsumers.get(space) ?? new Map();
      this.dataConsumers.set(space, dataConsumers);

      dataConsumers.set(playerId, dataConsumer);

      this.send({
        subject: "create_data_consumer",
        data: {
          playerId,
          consumerId: dataConsumer.id,
          dataProducerId: dataProducer.id,
          sctpStreamParameters: dataConsumer.sctpStreamParameters,
        },
      });
    } catch (err) {
      console.warn(err);
    }
  }

  resumeAudio() {
    this.consumers.forEach((consumers) => {
      consumers.forEach((consumer) => {
        if (consumer.paused && !consumer.closed) consumer.resume();
      });
    });
  }

  #startConsuming() {
    // Consume all other players
    this.spaces.forEach((space) =>
      space.players.forEach((otherPlayer, otherPlayerId) => {
        if (otherPlayer.producer) this.consume(otherPlayer.producer, space.id, otherPlayerId);
        if (otherPlayer.dataProducer)
          this.consumeData(otherPlayer.dataProducer, space.id, otherPlayerId);
      })
    );
  }

  close() {
    this.ws = null;
    this.spaces.forEach((space) => this.leave(space.id));
    this.consumerTransport?.close();
    this.producerTransport?.close();
  }
}
