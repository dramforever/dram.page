import scala.collection.mutable.ArrayBuffer

class Builder() {
  builder =>

  var strings = ArrayBuffer[String]()
  var varNum = 0

  def newVar: String = {
    varNum += 1
    s"v$varNum"
  }

  sealed trait Var {
    def value: String = this match {
      case Var(vx, _) => vx
    }

    def deriv: String = this match {
      case Var(_, dx) => dx
    }

    def unaryOp(mkValue: String => String,
                mkDeriv: String => String): Var = {
      val a = newVar
      strings += s"var $a = ${mkValue(this.value)};"

      this match {
        case Const(_) =>
          Const(a)
        case Diff(vx, dx) =>
          strings += s"var d$a = (${mkDeriv(this.value)}) * $dx;"
          Diff(a, s"d$a")
      }
    }

    def binOp(mkValue: (String, String) => String,
              mkDeriv: (String, String, String, String) => String)
             (that: Var): Var = {
      val a = newVar

      strings += s"var $a = ${mkValue(this.value, that.value)};"

      (this, that) match {
        case (Const(_), Const(_)) =>
          Const(a)
        case (Var(vx, dx), Var(vy, dy)) =>
          strings += s"var d$a = ${mkDeriv(vx, dx, vy, dy)};"
          Diff(a, s"d$a")
      }
    }

    def + : Var => Var = binOp(
      (vx, vy) => s"$vx + $vy",
      (vx, dx, vy, dy) => s"$dx + $dy"
    )

    def - : Var => Var = binOp(
      (vx, vy) => s"$vx - $vy",
      (vx, dx, vy, dy) => s"$dx - $dy"
    )

    def * : Var => Var = binOp(
      (vx, vy) => s"$vx * $vy",
      (vx, dx, vy, dy) => s"$vx * $dy + $dx * $vy"
    )

    def / : Var => Var = binOp(
      (vx, vy) => s"$vx / $vy",
      (vx, dx, vy, dy) => s"$dx / $vy - $vx * $dy / $vy / $vy"
    )

    def pow(x: Double) = unaryOp(
      v => s"Math.pow($v, $x)",
      v => s"Math.pow($v, $x - 1) * $x"
    )
  }

  object Var {
    def unapply(v: Var): Option[(String, String)] = v match {
      case Const(va) => Some((va, "0"))
      case Diff(va, de) => Some((va, de))
    }
  }

  case class Const(va: String) extends Var

  case class Diff(va: String, de: String) extends Var

  val t: Var = Diff("t", "1")

  def sin(x: Var) = x.unaryOp(
    v => s"Math.sin($v)",
    v => s"Math.cos($v)"
  )

  def cos(x: Var) = x.unaryOp(
    v => s"Math.cos($v)",
    v => s"- Math.sin($v)"
  )

  def exp(x: Var) = x.unaryOp(
    v => s"Math.exp($v)",
    v => s"Math.exp($v)"
  )

  def co(x: Double) = Const(x.toString)

  def generate(fname: String, output: List[Var]): String = {
    val header = s"function $fname(t) {"

    val middle = strings.map("    " + _).mkString("\n")

    val values = output.map(_.value)
    val derivs = output.map(_.deriv)
    val result = s"    return [[${values.mkString(",")}], [${derivs.mkString(",")}]];"

    val footer = s"}"

    List(header, middle, result, footer).mkString("\n")
  }
}

object Main extends App {
  val s = new Builder()

  s.strings.length

  val output = {
    import s._

    val rho = exp(cos(t)) - co(2) * cos(co(4) * t) - sin(t / co(12)).pow(5)

    List(cos(t) * rho, sin(t) * rho)
  }

  println(s.generate("equation", output))
}