
declare -a ALGS=(
stream-image
get-image-error
get-image-error1
get-image-error2
get-image-error3
stream-image-local
get-image-change-rate
get-image-change-rate1
get-image-change-rate2
get-all
get-and-sen-all
get-image-split
get-image-change-rate
)

IMAGE="docker.io/hkubedevtest/stream-image:vkk9x7w07"


for ALG in ${ALGS[@]}
do
        echo "updating $ALG algorithm"
	curl -k -X POST "https://cicd-test.hkube.org/hkube/api-server/api/v1/store/algorithms/apply" \
             -H  "accept: application/json" \
             -H  "Content-Type: multipart/form-data" \
             -F "payload={\"name\": \"$ALG\", \"algorithmImage\": \"$IMAGE\"};type=application/json" \
             -F "options={\"forceUpdate\": true}"
	sleep 1
done
