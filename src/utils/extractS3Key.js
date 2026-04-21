export const extractS3Key = (url) => {
  if (!url) return null;

  const parts = url.split(".amazonaws.com/");
  return parts[1]; // everything after bucket domain
};