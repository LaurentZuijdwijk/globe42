package org.globe42.web.charges

import com.nhaarman.mockitokotlin2.any
import com.nhaarman.mockitokotlin2.never
import com.nhaarman.mockitokotlin2.verify
import com.nhaarman.mockitokotlin2.whenever
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatExceptionOfType
import org.globe42.dao.ChargeDao
import org.globe42.dao.ChargeTypeDao
import org.globe42.dao.PersonDao
import org.globe42.domain.Charge
import org.globe42.domain.ChargeCategory
import org.globe42.domain.ChargeType
import org.globe42.domain.Person
import org.globe42.test.Mockito
import org.globe42.test.thenReturnModifiedFirstArgument
import org.globe42.web.exception.BadRequestException
import org.globe42.web.exception.NotFoundException
import org.junit.jupiter.api.Test
import org.mockito.InjectMocks
import org.mockito.Mock
import java.math.BigDecimal
import java.util.*

/**
 * Unit tests for [ChargeController]
 * @author JB Nizet
 */
@Mockito
class ChargeControllerTest {

    @Mock
    private lateinit var mockPersonDao: PersonDao

    @Mock
    private lateinit var mockChargeDao: ChargeDao

    @Mock
    private lateinit var mockChargeTypeDao: ChargeTypeDao

    @InjectMocks
    private lateinit var controller: ChargeController

    @Test
    fun `should list`() {
        val personId = 42L
        val person = Person(personId)
        val charge = createCharge(12L)
        person.addCharge(charge)
        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.of(person))

        val result = controller.list(personId)

        assertThat(result).hasSize(1)
        assertThat(result[0].id).isEqualTo(charge.id)
        assertThat(result[0].type.id).isEqualTo(charge.type.id)
        assertThat(result[0].monthlyAmount).isEqualTo(charge.monthlyAmount)
    }

    @Test
    fun `should throw if person not found`() {
        val personId = 42L
        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.empty())

        assertThatExceptionOfType(NotFoundException::class.java).isThrownBy { controller.list(personId) }
    }

    @Test
    fun `should delete`() {
        val personId = 42L
        val chargeId = 12L
        val charge = Charge(chargeId)
        charge.person = Person(personId)
        whenever(mockChargeDao.findById(chargeId)).thenReturn(Optional.of(charge))

        controller.delete(personId, chargeId)

        verify(mockChargeDao).delete(charge)
    }

    @Test
    fun `should accept deletion if not found to be idempotent`() {
        val chargeId = 12L
        whenever(mockChargeDao.findById(chargeId)).thenReturn(Optional.empty())

        controller.delete(42L, chargeId)

        verify(mockChargeDao, never()).delete(any())
    }

    @Test
    fun `should reject deletion if not in correct person`() {
        val chargeId = 12L
        val personId = 42L
        val charge = Charge(chargeId)
        charge.person = Person(personId)

        whenever(mockChargeDao.findById(chargeId)).thenReturn(Optional.of(charge))

        assertThatExceptionOfType(NotFoundException::class.java).isThrownBy { controller.delete(456L, chargeId) }
    }

    @Test
    fun `should create`() {
        val personId = 42L
        val typeId = 12L

        val person = Person(personId)
        val type = createChargeType(typeId)

        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.of(person))
        whenever(mockChargeTypeDao.findById(typeId)).thenReturn(Optional.of(type))
        whenever(mockChargeDao.save(any<Charge>())).thenReturnModifiedFirstArgument<Charge> { it.id = 34L }

        val command = ChargeCommandDTO(typeId, BigDecimal.TEN)

        val result = controller.create(personId, command)

        assertThat(result.id).isEqualTo(34L)
        assertThat(result.monthlyAmount).isEqualByComparingTo(command.monthlyAmount)
        assertThat(result.type.id).isEqualTo(command.typeId)
    }

    @Test
    fun `should throw when creating for unknown person`() {
        val personId = 42L
        val typeId = 12L

        val person = Person(personId)
        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.of(person))
        whenever(mockChargeTypeDao.findById(typeId)).thenReturn(Optional.empty())

        val command = ChargeCommandDTO(typeId, BigDecimal.TEN)
        assertThatExceptionOfType(BadRequestException::class.java).isThrownBy { controller.create(personId, command) }
    }

    @Test
    fun `should throw when creating with too large amount`() {
        val personId = 42L
        val typeId = 12L

        val person = Person(personId)
        val type = createChargeType(typeId)
        type.maxMonthlyAmount = BigDecimal("9")
        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.of(person))
        whenever(mockChargeTypeDao.findById(typeId)).thenReturn(Optional.of(type))

        val command = ChargeCommandDTO(typeId, BigDecimal.TEN)
        assertThatExceptionOfType(BadRequestException::class.java).isThrownBy { controller.create(personId, command) }
    }

    @Test
    fun `should throw when creating for unknown type`() {
        val personId = 42L
        val typeId = 12L

        whenever(mockPersonDao.findById(personId)).thenReturn(Optional.empty())

        val command = ChargeCommandDTO(typeId, BigDecimal.TEN)
        assertThatExceptionOfType(NotFoundException::class.java).isThrownBy { controller.create(personId, command) }
    }
}

internal fun createCharge(id: Long): Charge {
    val charge = Charge(id)
    val chargeType = createChargeType(id * 10)
    charge.type = chargeType
    charge.monthlyAmount = BigDecimal("123.45")
    return charge
}

internal fun createChargeType(id: Long): ChargeType {
    val chargeType = ChargeType(id)
    chargeType.category = ChargeCategory(id * 10, "rental")
    chargeType.name = "type $id"
    return chargeType
}
