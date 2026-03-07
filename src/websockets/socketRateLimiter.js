const rateLimits = new Map();

function getKey(socket, type) {
  return `${socket.id}:${type}`;
}

function checkRate(socket, type, maxPerWindow, windowMs = 1000) {
  const key = getKey(socket, type);
  const now = Date.now();

  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  const entry = rateLimits.get(key);
  if (now - entry.windowStart > windowMs) {
    entry.count = 1;
    entry.windowStart = now;
    return true;
  }

  entry.count += 1;
  if (entry.count > maxPerWindow) {
    return false;
  }
  return true;
}

function cleanUp() {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now - entry.windowStart > 60000) {
      rateLimits.delete(key);
    }
  }
}

const cleanupInterval = setInterval(cleanUp, 60000);
cleanupInterval.unref();

function socketRateLimiter(socket, next) {
  const originalOnevent = socket.onevent;
  socket.onevent = function rateLimitedOnevent(packet) {
    const eventName = packet.data ? packet.data[0] : '';
    let allowed = true;

    if (eventName === 'answer:submit' || eventName === 'answer:update') {
      allowed = checkRate(socket, 'answer', 10);
    } else if (eventName === 'quiz:join') {
      allowed = checkRate(socket, 'join', 3, 60000);
    } else {
      allowed = checkRate(socket, 'general', 30);
    }

    if (!allowed) {
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    originalOnevent.call(socket, packet);
  };
  next();
}

module.exports = { socketRateLimiter, checkRate };
