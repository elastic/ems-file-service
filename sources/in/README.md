# India States and Territories

India has claims on regions administered by Pakistan and China. These claims should be included in the state of Jammu and Kashmir in the India States and Territories layer. The disputed claim regions are included in the Sophox query and downloaded as separate features in the GeoJSON feature colleciton. These separate features should be manually merged with the Jammu and Kashmir state feature.

For example,
```
mapshaper -i id-field=id sophox_data.json -sort this.id -dissolve iso_3166_2 copy-fields=id,label_en,label_hi -o prettify format=geojson id-field=id data/india_states_v1.geo.json
```

_Note: The Elastic Maps Service is provided "as is" without warranty of any kind. Elastic and its suppliers and licensors make no claims as to the completeness, accuracy or content of the Elastic Maps Services and hereby disclaim any all warranties, express, implied or statutory, including, without limitation, the implied warranties of merchantability, fitness for a particular purpose and non-infringement. Neither Elastic nor its suppliers and licensors makes any warranty that the Elastic Maps Service will be error free, timely, meet your specific requirements or that access thereto will be continuous or uninterrupted._

For more information, please see the [Elastic Maps Service Terms of Service](https://www.elastic.co/elastic-maps-service-terms)
