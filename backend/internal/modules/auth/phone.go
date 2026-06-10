package auth

import (
	"errors"
	"regexp"
	"strings"
)

var nonDigits = regexp.MustCompile(`\D+`)

func NormalizeKZPhone(phone string) (string, error) {
	digits := nonDigits.ReplaceAllString(phone, "")
	if digits == "" {
		return "", errors.New("номер телефона обязателен")
	}

	if strings.HasPrefix(digits, "8") {
		digits = "7" + digits[1:]
	}
	if !strings.HasPrefix(digits, "7") {
		digits = "7" + digits
	}

	if len(digits) != 11 || !strings.HasPrefix(digits, "77") {
		return "", errors.New("введите корректный номер Казахстана в формате +7")
	}

	return "+" + digits, nil
}
