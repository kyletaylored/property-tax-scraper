#!/bin/bash

# Set initial page number and page size
page_number=1
page_size=5000
base_url="https://esearch.dentoncad.com/Search/SearchResults"

# Loop to fetch data in chunks
while : ; do
    # Generate the URL for the current page
    url="${base_url}?keywords=Address:denton%20PropertyType:Real%20Year:2024&page=${page_number}&pageSize=${page_size}&filter=null&sort=null"
    
    # Use curl to download the data
    curl -o "output_${page_number}.json" "$url"
    
    # Check if the last file was smaller than expected, indicating last page might have been reached
    if [ $(wc -c <"output_${page_number}.json") -lt 100 ]; then  # Adjust this condition based on typical empty response size
        echo "Last page reached or no data returned. Stopping."
        break
    fi
    
    # Increment the page number
    let page_number+=1
    
    # Optional: Sleep between requests to not overwhelm the server
    sleep 2
done

echo "Download completed."
