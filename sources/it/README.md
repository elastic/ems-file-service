# Italy Provinces

## Source version 1

*Last updated: 2018-12-27*

### Abolished Provinces
Several provinces have been abolished in recent years, but the [ISO 3166 Country Codes](https://www.iso.org/obp/ui/#iso:code:3166:IT) have not been updated to remove those province codes. 

The following provinces were absorbed into a new province called South Sardinia.
- [Carbonia-Iglesias, IT-CI](https://en.wikipedia.org/wiki/Province_of_Carbonia-Iglesias)
- [Medio Campidano, IT-VS](https://en.wikipedia.org/wiki/Province_of_Medio_Campidano)
- [Ogliastra, IT-OG](https://en.wikipedia.org/wiki/Province_of_Ogliastra)
- [Olbia-Tempio, IT-OT](https://en.wikipedia.org/wiki/Province_of_Olbia-Tempio)

The provinces of Fruili-Venezia Giulia were abolished in 2017 and the administrative duties were delegated to the municipalities. However, the geographic boundaries of the provinces are still relevant, so they are included.

- [Gorizia, IT-GO](https://en.wikipedia.org/wiki/Province_of_Gorizia)
- [Pordenone, IT-PN](https://en.wikipedia.org/wiki/Province_of_Pordenone)
- [Trieste, IT-TS](https://en.wikipedia.org/wiki/Province_of_Trieste)
- [Udine, IT-UD](https://en.wikipedia.org/wiki/Province_of_Udine)

### New Provinces without ISO Codes
[South Sardinia](https://en.wikipedia.org/wiki/Province_of_South_Sardinia) is a new province that does not yet have an ISO code. This layer should be updated once an ISO code is given to South Sardinia.

### Metropolitan Cities
Some abolished provinces have been replaced with Metropolitan Cities. It is assumed that these Metropolitan Cities and their former provinces have the same boundaries. Therefore, the Elastic Maps Service publishes the Metropolitan City boundaries with the former ISO province codes as shown in the table below.

|ISO Code|Former Province|Metropolitan City|
|---|---|---|
|IT-BA|Bari|Metropolitan City of Bari|
|IT-BO|Bologna|Metropolitan City of Bologna|
|IT-CA|Cagliari|Metropolitan City of Cagliari[^1]|
|IT-CT|Catania|Metropolitan City of Catania|
|IT-FI|Florence|Metropolitan City of Florence|
|IT-GE|Genoa|Metropolitan City of Genoa|
|IT-ME|Messina|Metropolitan City of Messina|
|IT-MI|Milan|Metropolitan City of Milan|
|IT-NA|Naples|Metropolitan City of Naples|
|IT-PA|Palermo|Metropolitan City of Palermo|
|IT-RC|Reggio Calabria|Metropolitan City of Reggio Calabria|
|IT-RM|Rome|Metropolitan City of Rome|
|IT-TO|Turin|Metropolitan City of Turin|
|IT-VE|Venice|Metropolitan City of Venice|

[^1]: [Cagliari Province](https://en.wikipedia.org/wiki/Province_of_Cagliari) was originally much larger than the [Metropolitan City of Caligari](https://en.wikipedia.org/wiki/Metropolitan_City_of_Cagliari). However, the GeoLite2 IP database (used by the [Ingest GeoIP Plugin](https://www.elastic.co/guide/en/elasticsearch/plugins/current/ingest-geoip.html)) entry for IT-CA includes only the municipalities within the Metropolitan City of Cagliari so we use the Metropolitan City boundaries.

### Sicilian Provinces
Some Sicilian provinces are in a state of flux on Wikidata as they have been re-classified as "Libero consorzio comunale". However, the Wikidata pages on the re-classified items are incomplete (ex. [Libero consorzio comunale di Ragusa](https://www.wikidata.org/wiki/Q26160405)). So the Sophox query is modified to include the old province Wikidata items (ex. [Province of Ragusa](https://www.wikidata.org/wiki/Q16251)) instead.

### Aosta Province
The [Aosta Valley autonomous region](https://en.wikipedia.org/wiki/Aosta_Valley) is no longer separated into provinces. The Province of Aosta was dissolved in 1945, yet an ISO code exists for Aosta Province (IT-AO). The IT-AO entry in the GeoLite2 IP database appears to contain cities from all over the Aosta Valley region. So the SPARQL query is written to include the Aosta Valley region but bind it to the IT-AO code.

## Source version 2

*Last updated: 2019-10-24*

* South Sardinia got the proper ISO code `IT-SD`
* Several provinces changed their official name, for this reason this source will only be available after `8.0` release
* Sicilian and Aosta provinces divisions remain as "special cases"
* For some provinces the `istat` code has changed