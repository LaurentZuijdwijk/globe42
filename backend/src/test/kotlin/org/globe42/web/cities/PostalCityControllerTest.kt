package org.globe42.web.cities

import com.nhaarman.mockitokotlin2.verify
import com.nhaarman.mockitokotlin2.whenever
import org.assertj.core.api.Java6Assertions.assertThat
import org.globe42.dao.PostalCityDao
import org.globe42.domain.PostalCity
import org.globe42.test.Mockito
import org.junit.jupiter.api.Test
import org.mockito.InjectMocks
import org.mockito.Mock
import java.util.*

/**
 * Unit tests for [PostalCityController]
 * @author JB Nizet
 */
@Mockito
class PostalCityControllerTest {
    @Mock
    private lateinit var mockPostalCityDao: PostalCityDao

    @Mock
    private lateinit var mockUploadParser: PostalCityUploadParser

    @InjectMocks
    private lateinit var controller: PostalCityController

    @Test
    fun `should search by postal code when query is numeric`() {
        val postalCity = PostalCity("42000", "ST ETIENNE")
        whenever(mockPostalCityDao.findByPostalCode("420", LIMIT)).thenReturn(listOf(postalCity))

        val result = controller.search("420")

        assertThat(result).hasSize(1)
        assertThat(result[0].code).isEqualTo(postalCity.postalCode)
        assertThat(result[0].city).isEqualTo(postalCity.city)
    }

    @Test
    fun `should search by city when query is not numeric`() {
        val postalCity = PostalCity("42000", "ST ETIENNE")
        whenever(mockPostalCityDao.findByCity("ST ET", LIMIT)).thenReturn(listOf(postalCity))

        val result = controller.search("ST ET")

        assertThat(result).hasSize(1)
        assertThat(result[0].code).isEqualTo(postalCity.postalCode)
        assertThat(result[0].city).isEqualTo(postalCity.city)
    }

    @Test
    fun `should upload`() {
        val body = "fake".toByteArray()
        val parsedCities = Arrays.asList(PostalCity("42000", "ST ETIENNE"))
        whenever(mockUploadParser.parse(body)).thenReturn(parsedCities)

        controller.upload(body)

        verify(mockPostalCityDao).saveAllEfficiently(parsedCities)
    }
}
