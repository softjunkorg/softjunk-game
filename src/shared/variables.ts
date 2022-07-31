export default {
    RESOURCE_NAME: GetCurrentResourceName(),
    IS_RESOURCE_SERVER: IsDuplicityVersion(),
    IS_RESOURCE_CLIENT: !IsDuplicityVersion(),
};
