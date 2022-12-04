import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { Room } from "@prisma/client";

//Sabe criar objetos - Hotel do banco
export async function createHotel() {
  return await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.imageUrl(),
    },
  });
}

export async function createRoomWithHotelId(params: Partial<Room> = {}): Promise<Room> {
  return prisma.room.create({
    data: {
      name: params.name || faker.name.findName(),
      capacity: params.capacity || faker.datatype.number(),
      hotelId: params.hotelId,
    },
  });
}
