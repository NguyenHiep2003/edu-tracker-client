import instance from '../common/axios';

export const updateTopicRequest = async (
    topicRequestId: number,
    data: {
        title: string;
        description?: string;
    }
) => {
    const response = await instance.patch(
        `/v1/topic/topic-request/${topicRequestId}`,
        {
            title: data.title,
            description: data.description ? data.description : undefined,
        }
    );
    return response.data;
};

export const deleteTopicRequest = async (topicRequestId: number) => {
    const response = await instance.delete(
        `/v1/topic/topic-request/${topicRequestId}`
    );
    return response.data;
};

export async function acceptTopicRequest(topicRequestId: number) {
    const response = await instance.patch(
        `/v1/topic/topic-request/${topicRequestId}/accept`
    );
    return response.data;
}
