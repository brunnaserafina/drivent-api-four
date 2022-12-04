import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createPayment,
  createTicketTypeWithHotel,
  createHotel,
  createRoomWithHotelId,
  createBooking,
  createTicketTypeRemote,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user doesnt have a booking yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and with booking data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId({ hotelId: hotel.id });
      const booking = await createBooking(user.id, room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  describe("when token is valid", () => {
    it("should respond with status 400 when roomId is not sent in the body", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({});

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });
    
    it("should respond with status 400 when roomId is not a number", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const roomId = faker.lorem.word();

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });
    
    it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const roomId = faker.datatype.number({ min: 1 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const roomId = faker.datatype.number({ min: 1 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 403 when ticket is not paid yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      await createPayment(ticket.id, ticketType.price);

      const roomId = faker.datatype.number({ min: 1 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 403 when ticket type is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const roomId = faker.datatype.number({ min: 1 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 404 when roomId doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      await createHotel();
      const roomId = faker.datatype.number({ min: 1 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    
    it("should respond with status 403 when roomId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      await createHotel();
      const roomId = 0;

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });
    
    it("should respond with status 403 when user has a previous booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId({ hotelId: hotel.id, capacity: 1 });
      await createBooking(user.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 403 when room is already occupied to maximum capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId({ hotelId: hotel.id, capacity: 1 });

      const otherUser = await createUser();
      await createBooking(otherUser.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 200 and with bookingId when everything is ok", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId({ hotelId: hotel.id, capacity: 4 });

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.OK);

      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });

    it("should insert a new booking into database when everything is ok", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      
      const hotel = await createHotel();
      const room = await createRoomWithHotelId({ hotelId: hotel.id, capacity: 4 });

      const beforeCount = await prisma.booking.count();

      await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      const afterCount = await prisma.booking.count();

      expect(beforeCount).toEqual(0);
      expect(afterCount).toEqual(1);
    });
  });
});
