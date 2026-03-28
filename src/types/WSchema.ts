type WMessage = {
  from_me: boolean,
  timestamp: number,
  time: string,
  media: boolean,
  key_id: string,
  meta: boolean,
  data: string | null,
  sender: string | null,
  safe: boolean,
  mime: string | null,
  message_type: number,
  received_timestamp: string,
  read_timestamp: string | null,
  reply: string | null,
  quoted_data: string | null,
  caption: string | null,
  thumb: string | null,
  sticker: boolean,
  reactions: Record<string, string>
}

type WBase = {
  name: string | null;
  type: "android" | "ios",
  my_avatar: string | null;
  their_avatar: string | null,
  their_avatar_thumb: string | null,
  status: string | null,
  media_base: string | null,
  messages: Record<string, WMessage>
}

type WChatContact = `${string}@${"s.whatsapp.net" | "g.us"}` // Example: 01537220785@s.whatsapp.net (single user), 120363343553728046@g.us (group)

export type WSchema = Record<WChatContact, WBase>