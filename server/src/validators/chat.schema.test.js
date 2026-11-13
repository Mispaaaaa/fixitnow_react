import { createConversationSchema } from './chat.schema.js';

describe('createConversationSchema', () => {
  it('accepts a consultation with a technician', () => {
    const result = createConversationSchema.safeParse({ technicianId: 7 });

    expect(result.success).toBe(true);
  });

  it('accepts a request-based conversation', () => {
    const result = createConversationSchema.safeParse({ requestId: 12 });

    expect(result.success).toBe(true);
  });

  it('rejects empty input and conflicting conversation targets', () => {
    expect(createConversationSchema.safeParse({}).success).toBe(false);
    expect(createConversationSchema.safeParse({ requestId: 12, technicianId: 7 }).success).toBe(false);
  });
});
