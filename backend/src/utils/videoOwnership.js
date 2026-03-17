const VIDEO_RECORD_PREFIX = 'videojob:';
const VIDEO_RECORD_TTL_SECONDS = 30 * 24 * 60 * 60;

const getVideoRecordKey = (videoId) => `${VIDEO_RECORD_PREFIX}${videoId}`;

export const createVideoOwnershipRecord = async (kv, { videoId, userId, model = null }) => {
  if (!kv || !videoId || !userId) {
    throw new Error('Video ownership record requires KV, videoId, and userId');
  }

  const record = {
    videoId,
    userId,
    model,
    createdAt: new Date().toISOString()
  };

  await kv.put(getVideoRecordKey(videoId), JSON.stringify(record), {
    expirationTtl: VIDEO_RECORD_TTL_SECONDS
  });

  return record;
};

export const getVideoOwnershipRecord = async (kv, videoId) => {
  if (!kv || !videoId) {
    return null;
  }

  try {
    return await kv.get(getVideoRecordKey(videoId), 'json');
  } catch (error) {
    console.error('Error reading video ownership record:', error);
    return null;
  }
};

export const canUserAccessVideo = (record, user) => {
  if (!record || !user) {
    return false;
  }

  return record.userId === user.id || user.role === 'admin';
};
