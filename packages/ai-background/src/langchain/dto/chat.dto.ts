export class ChatDto {
  message: string;
}

export class ImageAnalysisDto {
  imageUrl: string;
  question?: string;
}

export class AgentTaskDto {
  imageUrl: string;
  task: string;
}

