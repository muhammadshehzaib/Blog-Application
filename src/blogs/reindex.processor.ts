import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BlogsService } from './blogs.service';

export const REINDEX_QUEUE = 'reindex';
export const REINDEX_JOB = 'reindex-all';

export interface ReindexResult {
  total: number;
  indexed: number;
  failed: number;
}

@Processor(REINDEX_QUEUE)
export class ReindexProcessor extends WorkerHost {
  private readonly logger = new Logger(ReindexProcessor.name);

  constructor(private blogsService: BlogsService) {
    super();
  }

  async process(job: Job): Promise<ReindexResult> {
    this.logger.log(`reindex job ${job.id} started`);

    const result = await this.blogsService.reindexAll((done, total) => {
      const pct = total ? Math.round((done / total) * 100) : 0;
      void job.updateProgress(pct);
    });

    this.logger.log(
      `reindex job ${job.id} done — indexed ${result.indexed}/${result.total}, failed ${result.failed}`,
    );
    return result;
  }
}
