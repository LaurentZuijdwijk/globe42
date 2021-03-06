package org.globe42.web.charges

import com.nhaarman.mockitokotlin2.any
import com.nhaarman.mockitokotlin2.verify
import com.nhaarman.mockitokotlin2.whenever
import org.assertj.core.api.Assertions.assertThat
import org.globe42.dao.ChargeCategoryDao
import org.globe42.domain.ChargeCategory
import org.globe42.test.Mockito
import org.globe42.test.thenReturnModifiedFirstArgument
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Captor
import org.mockito.InjectMocks
import org.mockito.Mock
import java.util.*

/**
 * Unit tests for [ChargeCategoryController]
 * @author JB Nizet
 */
@Mockito
class ChargeCategoryControllerTest {

    @Mock
    private lateinit var mockChargeCategoryDao: ChargeCategoryDao

    @InjectMocks
    private lateinit var controller: ChargeCategoryController

    @Captor
    private lateinit var chargeCategoryArgumentCaptor: ArgumentCaptor<ChargeCategory>

    private lateinit var chargeCategory: ChargeCategory

    @BeforeEach
    fun prepare() {
        chargeCategory = ChargeCategory(1L, "rental")
    }

    @Test
    fun `should get`() {
        whenever(mockChargeCategoryDao.findById(chargeCategory.id!!)).thenReturn(Optional.of(chargeCategory))

        val result = controller.get(chargeCategory.id!!)

        assertThat(result.id).isEqualTo(chargeCategory.id!!)
    }

    @Test
    fun `should list`() {
        whenever(mockChargeCategoryDao.findAll()).thenReturn(listOf<ChargeCategory>(chargeCategory))

        val result = controller.list()

        assertThat(result).hasSize(1)
        assertThat(result[0].id).isEqualTo(1L)
        assertThat(result[0].name).isEqualTo("rental")
    }

    @Test
    fun `should create`() {
        val command = createCommand()

        whenever(mockChargeCategoryDao.existsByName(command.name)).thenReturn(false)
        whenever(mockChargeCategoryDao.save(any<ChargeCategory>()))
            .thenReturnModifiedFirstArgument<ChargeCategory> { it.id = 42 }

        val result = controller.create(command)

        verify(mockChargeCategoryDao).save(chargeCategoryArgumentCaptor.capture())

        assertThat(result.id).isEqualTo(42L)
        assertChargeCategoryEqualsCommand(chargeCategoryArgumentCaptor.value, command)
    }

    @Test
    fun `should update`() {
        val command = createCommand()

        whenever(mockChargeCategoryDao.findById(chargeCategory.id!!)).thenReturn(Optional.of(chargeCategory))
        whenever(mockChargeCategoryDao.findByName(command.name)).thenReturn(Optional.empty())

        controller.update(chargeCategory.id!!, command)

        assertChargeCategoryEqualsCommand(chargeCategory, command)
    }

    private fun assertChargeCategoryEqualsCommand(source: ChargeCategory, command: ChargeCategoryCommandDTO) {
        assertThat(source.name).isEqualTo(command.name)
    }

    private fun createCommand(): ChargeCategoryCommandDTO = ChargeCategoryCommandDTO("Food")
}
