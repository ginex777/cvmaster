import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { LinkedInOptimization } from '../ai/provider';

@Injectable()
export class LinkedInService {
  constructor(private readonly ai: AiService) {}

  async optimize(
    profileText: string,
    targetRole: string,
    userId: string,
  ): Promise<LinkedInOptimization> {
    return this.ai.optimizeLinkedIn(profileText, targetRole, { userId });
  }
}
