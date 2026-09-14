import mongoose from "mongoose";

const clearCollections = async () => {
  const collections = mongoose.connection.collections;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
};

export { clearCollections };
