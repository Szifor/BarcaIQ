package com.barcaiq.api_service.model;

import lombok.Data;

@Data
public class PressRequest {
    private double normX;
    private double normY;
    private double isFinalThird;
    private double isMidThird;
    private double isLeftFlank;
    private double isRightFlank;
    private double minute;
    private double isFirstHalf;
    private double isCounterpress;
    private int    teammatePressing;
    private int    pressIndexInPossession;
}