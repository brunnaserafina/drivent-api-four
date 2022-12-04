import { prisma } from "@/config";

async function findRoomById(id: number) {
  return prisma.room.findUnique({
    where: {
      id,
    },
  });
}

const roomsRepository = { findRoomById };

export default roomsRepository;
