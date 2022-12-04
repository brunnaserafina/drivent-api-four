import { notFoundError, forbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import roomsRepository from "@/repositories/rooms-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { Room } from "@prisma/client";

async function getBooking(userId: number): Promise<{ id: number; Room: Room }> {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) throw notFoundError();

  return booking;
}

async function postBooking(userId: number, roomId: number): Promise<{ id: number }> {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError();

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw forbiddenError();
  }

  const room = await roomsRepository.findRoomById(roomId);
  if (!room) throw notFoundError();

  const existingUserBooking = await bookingRepository.findBookingByUserId(userId);
  if (existingUserBooking) throw forbiddenError();

  const roomWithBookings = await bookingRepository.findBookingsByRoomId(roomId);
  if (roomWithBookings.length >= room.capacity) throw forbiddenError();

  const createdBooking = await bookingRepository.createBooking(userId, roomId);
  return createdBooking;
}

const bookingService = { getBooking, postBooking };

export default bookingService;
