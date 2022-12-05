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

async function updateBooking(userId: number, roomId: number, bookingId: number): Promise<{ id: number }> {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) throw notFoundError();

  if (booking.userId !== userId) throw forbiddenError();
 
  const room = await roomsRepository.findRoomById(roomId);
  if (!room) throw notFoundError();

  const roomWithBookings = await bookingRepository.findBookingsByRoomId(roomId);
  if (roomWithBookings.length >= room.capacity) throw forbiddenError();

  const updatedBooking = await bookingRepository.updateBooking(bookingId, roomId);
  return updatedBooking;
}

const bookingService = { getBooking, postBooking, updateBooking };

export default bookingService;
